import 'package:flutter/material.dart';
import '../../../../config/ps_colors.dart';
import '../../../config/route/route_paths.dart';
import '../../../core/vendor/constant/ps_dimens.dart';
import '../../../core/vendor/utils/utils.dart';
import '../../../core/vendor/viewobject/user.dart';
import 'smooth_star_rating_widget.dart';

class UserRatingWidget extends StatelessWidget {
  const UserRatingWidget({Key? key, required this.user, this.count})
      : super(key: key);

  final User? user;
  final int? count;
  @override
  Widget build(BuildContext context) {
    final String? rating =
        user!.overallRating != '' ? user!.overallRating : '0';
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: <Widget>[
        Text(
          rating ?? '0',
          style: Theme.of(context).textTheme.bodyLarge!.copyWith(
              color: Utils.isLightMode(context)
                  ? PsColors.achromatic500
                  : PsColors.text50,
              fontSize: 14),
        ),
        const SizedBox(
          width: PsDimens.space8,
        ),
        InkWell(
          onTap: () {
            Navigator.pushNamed(context, RoutePaths.ratingList,
                arguments: user!.userId);
          },
          child: SmoothStarRating(
              key: Key(rating ?? '0'),
              rating: double.parse(rating ?? '0'),
              allowHalfRating: true,
              isReadOnly: true,
              starCount: 5,
              color: PsColors.warning500,
              borderColor: PsColors.warning500,
              onRated: (double? v) async {},
              spacing: 0.0),
        ),
      ],
    );
  }
}

class UserRatingWidgetWithReviews extends StatelessWidget {
  const UserRatingWidgetWithReviews({Key? key, required this.user})
      : super(key: key);

  final User? user;
  @override
  Widget build(BuildContext context) {
    final String? rating =
        user!.overallRating != '' ? user!.overallRating : '0';
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: <Widget>[
        InkWell(
          onTap: () {
            Navigator.pushNamed(context, RoutePaths.ratingList,
                arguments: user!.userId);
          },
          child: SmoothStarRating(
              key: Key(rating ?? '0'),
              rating: double.parse(rating ?? '0'),
              allowHalfRating: true,
              isReadOnly: true,
              starCount: 5,
              size: 16,
              color: PsColors.warning500,
              borderColor: PsColors.warning500,
              onRated: (double? v) async {},
              spacing: 0.0),
        ),
        const SizedBox(
          width: PsDimens.space8,
        ),
        Text(
          '${rating ?? '0'} reviews',

          // '${user?.ratingCount ?? '0'} reviews',
          style: Theme.of(context).textTheme.bodyLarge!.copyWith(
              color: Utils.isLightMode(context)
                  ? PsColors.achromatic500
                  : PsColors.text50,
              fontSize: 14),
        ),
      ],
    );
  }
}
